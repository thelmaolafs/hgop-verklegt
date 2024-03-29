module.exports = function(context) {
  const express = context('express');
  const databaseConstructor = context('database');
  const database = databaseConstructor(context);
  const configConstructor = context('config');
  const config = configConstructor(context);
  const lucky21Constructor = context('lucky21');
  const HotShotsConstructor = require('hot-shots');
  const hotShots = new HotShotsConstructor({
    host: 'my_datadog_container',
    globalTags: process.env.ENVIRONMENT,
  });

  const app = express();

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });

  app.get('/status', (req, res) => {
    res.statusCode = 200;
    res.send('The API is running!\n');
  });

  let game = undefined;

  // Gets game statistics
  app.get('/stats', (req, res) => {
    database.getTotalNumberOfGames((totalNumberOfGames) => {
      database.getTotalNumberOfWins((totalNumberOfWins) => {
        database.getTotalNumberOf21((totalNumberOf21) => {
          // Week 3
          // Explain why we put each consecutive call inside the onSuccess callback of the
          // previous database call, instead of just placing them next to each other.
          // E.g.
          // database.call1(...);
          // database.call2(...);
          // database.call3(...);
          /*
          We put each consecutive call inside the onSuccess callback of the previous
          database call to allow the code to continue without having to wait for each
          call between services to finish. This would not be a good idea if we were writing
          to a database where the order is important, but in this case we are reading from
          a database that should not change while we make these calls.
          */
          res.statusCode = 200;
          res.send({
            totalNumberOfGames: totalNumberOfGames,
            totalNumberOfWins: totalNumberOfWins,
            totalNumberOf21: totalNumberOf21,
          });
        }, (err) => {
          console.log('Failed to get total number of 21, Error:' + JSON.stringify(err));
          res.statusCode = 500;
          res.send();
        });
      }, (err) => {
        console.log('Failed to get total number of wins, Error:' + JSON.stringify(err));
        res.statusCode = 500;
        res.send();
      });
    }, (err) => {
      console.log('Failed to get total number of games, Error:' + JSON.stringify(err));
      res.statusCode = 500;
      res.send();
    });
  });

  // Starts a new game.
  app.post('/start', (req, res) => {
    if (game && game.isGameOver(game) == false) {
      res.statusCode = 409;
      res.send('There is already a game in progress');
    } else {
      game = lucky21Constructor(context);
      const msg = 'Game started';
      hotShots.increment('games.started');
      res.statusCode = 201;
      res.send(msg);
    }
  });

  // Returns the player's board state.
  app.get('/state', (req, res) => {
    if (game) {
      res.statusCode = 200;
      res.send(game.getState(game));
    } else {
      const msg = 'Game not started';
      res.statusCode = 204;
      res.send(msg);
    }
  });

  // Player makes a guess that the next card will be 21 or under.
  app.post('/guess21OrUnder', (req, res) => {
    if (game) {
      if (game.isGameOver(game)) {
        const msg = 'Game is already over';
        res.statusCode = 403;
        res.send(msg);
      } else {
        game.guess21OrUnder(game);
        hotShots.increment('games.guessed21OrUnder');
        if (game.isGameOver(game)) {
          const won = game.playerWon(game);
          const score = game.getCardsValue(game);
          const total = game.getTotal(game);
          database.insertResult(won, score, total, () => {
            console.log('Game result inserted to database');
          }, (err) => {
            console.log('Failed to insert game result, Error:' + JSON.stringify(err));
          });
        }
        res.statusCode = 201;
        res.send(game.getState(game));
      }
    } else {
      const msg = 'Game not started';
      res.statusCode = 204;
      res.send(msg);
    }
  });

  // Player makes a guess that the next card will be over 21.
  app.post('/guessOver21', (req, res) => {
    if (game) {
      if (game.isGameOver(game)) {
        const msg = 'Game is already over';
        res.statusCode = 403;
        res.send(msg);
      } else {
        game.guessOver21(game);
        hotShots.increment('games.guessedOver21');
        if (game.isGameOver(game)) {
          const won = game.playerWon(game);
          const score = game.getCardsValue(game);
          const total = game.getTotal(game);
          database.insertResult(won, score, total, () => {
            console.log('Game result inserted to database');
          }, (err) => {
            console.log('Failed to insert game result, Error:' + JSON.stringify(err));
          });
        }
        res.statusCode = 201;
        res.send(game.getState(game));
      }
    } else {
      const msg = 'Game not started';
      res.statusCode = 204;
      res.send(msg);
    }
  });

  const port = config.port;
  return {
    listen: () => {
      app.listen(port, () => {
        console.log('Game API listening on port ' + port);
      });
    },
  };
};
