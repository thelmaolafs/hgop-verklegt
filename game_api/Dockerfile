#This text documents contains the commands to assemble the docker 
#image (essentially the production environment)

#specifies the Parent docker image from which we build.
FROM node:erbium

#Sets the working directory to /code.
WORKDIR /code

#copies package.json from the source and pastes it with the same name inside the 
#image (recipe for a container) we are creating
COPY package.json package.json

#RUN sends the parameter to the default shell, so "npm install" 
#is called before the image is ready
RUN npm install --production

#The next two lines copy database.js and app.js from our source folder 
#into the image just like before
COPY database.js database.js

COPY app.js app.js

COPY context.js context.js

COPY lucky21.js lucky21.js

COPY deck.js deck.js

COPY dealer.js dealer.js

COPY server.js server.js

COPY inject.js inject.js

COPY random.js random.js

COPY config.js config.js

COPY migrations/20191210120722-GameResultTable.js migrations/20191210120722-GameResultTable.js

COPY database.json database.json

COPY migrations/20191210134907-GameResultTableAddInsertDate.js migrations/20191210134907-GameResultTableAddInsertDate.js

# Give postgres time to setup before we try to migrate.
CMD sleep 5 && npm run migratedb:pg && node app.js
