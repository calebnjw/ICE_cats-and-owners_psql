// SELECT * FROM [table] (WHERE [column]=[value])
// SELECT * FROM [table] ORDER BY [column] ASC/DESC
// INSERT INTO [table] ([column], [column]) VALUES ([value], [value])
// UPDATE [table] SET [column]=[value] WHERE [column]=[value]
// DELETE FROM [table] WHERE [column]=[value];
// ALTER TABLE [table] CHANGE [column] [newName] [datatype]

// import postgres
import pg from 'pg';

const { Pool } = pg; // get postgres pool

// set up postgres database connection
const pgConnectionConfigs = {
  user: 'calebnjw',
  host: 'localhost',
  database: 'calebnjw',
  port: 5432, // Postgres server always runs on this port
};

// create new cleint with configuration information
const pool = new Pool(pgConnectionConfigs);

// connect to the database
pool.connect();

// action to carry out from cmd line
const action = process.argv[2];

// function to submit INSERT query
const insertQuery = (query) => {
  console.log('Running INSERT');
  console.log(query);

  pool.query(query, (error, result) => {
    if (error) {
      console.log('Failed INSERT');
      console.log(error);
    }
  });

  console.log('Done INSERT');
};

// function to create new owner
const createNewOwner = (ownerName) => {
  const query = `INSERT INTO cat_owners (name) VALUES ('${ownerName}');`;
  insertQuery(query);
};

// function to create new cat
const createNewCat = (ownerName, catName) => {
  // first we get the list of owners and their corresponding IDs
  const ownerQuery = 'SELECT * FROM cat_owners';
  pool.query(ownerQuery, (ownerError, ownerResult) => {
    console.log('Getting Owners');

    if (ownerError) {
      console.log(ownerError);
      return;
    }

    // create new object to store names and id
    // name will be the key, and id will be value
    // because we want to type in the name, and then obtain the key based on name
    const owners = {};
    ownerResult.rows.forEach((owner) => {
      owners[owner.name] = owner.id;
    });

    const ownerID = owners[ownerName];
    console.log(ownerID);

    const query = `INSERT INTO cats (owner_id, name) VALUES ('${ownerID}', '${catName}');`;
    insertQuery(query);
  });
};

// conditionals to run code
if (action === 'create-owner') {
  console.log('adding new owner to database');

  const name = process.argv[3];

  createNewOwner(name);
}

if (action === 'create-cat') {
  console.log('adding new cat to database');

  // const id = process.argv[3];
  const ownerName = process.argv[3];
  const name = process.argv[4];

  // createNewCat(id, name);
  createNewCat(ownerName, name);
}

if (action === 'cats') {
  const ownerQuery = 'SELECT * FROM cat_owners';
  pool.query(ownerQuery, (ownerError, ownerResult) => {
    console.log('Getting Owners');

    if (ownerError) {
      console.log(ownerError);
      return;
    }

    // create new object to store names and id
    // id will be the key, and name will be value
    // this is so that we can substitute the value into the cat lookup
    const owners = {};
    ownerResult.rows.forEach((owner) => {
      owners[owner.id] = owner.name;
    });

    const catQuery = 'SELECT * FROM cats';
    pool.query(catQuery, (catError, catResult) => {
      console.log('Getting Cats');

      if (catError) {
        console.log(catError);
        return;
      }

      console.log('Cats:');
      catResult.rows.forEach((cat) => {
        // getting name and owner_id of the cat
        const { name: catName, owner_id: catOwnerID } = cat;
        // getting name of cat owner using the object we created above
        const catOwner = owners[catOwnerID];

        const output = `${catName}: ${catOwner}`;
        console.log(output);
      });
    });
  });
}

if (action === 'owners') {
  const catQuery = 'SELECT * FROM cats';
  pool.query(catQuery, (catError, catResult) => {
    console.log('Getting Cats');

    if (catError) {
      console.log(catError);
      return;
    }

    // new object to store cats grouped by owner_id
    // owner_id is the key, and the value will be an array with cat names
    const catsByOwner = {};
    catResult.rows.forEach((cat) => {
      // if the owner is not registered in the array,
      if (catsByOwner[cat.owner_id] === undefined) {
        // create new key:value pair, with the value stored in an array
        catsByOwner[cat.owner_id] = [cat.name];
      } else {
        // else append cat name to the end of the existing list
        catsByOwner[cat.owner_id].push(cat.name);
      }
    });

    const ownerQuery = 'SELECT * FROM cat_owners';
    pool.query(ownerQuery, (ownerError, ownerResult) => {
      console.log('Getting Owners');

      if (ownerError) {
        console.log(ownerError);
        return;
      }

      console.log('Owners:');
      // ownerResult.rows should return a list of objects
      ownerResult.rows.forEach((owner) => {
        // getting name and id of the owners
        const { name: ownerName, id: ownerID } = owner;

        console.log(`- ${ownerName}`);

        // then we make use of the object we created above
        // to get the list of cats from each owner using owner id
        catsByOwner[ownerID].forEach((cat) => {
          console.log(`  - ${cat}`);
        });
      });
    });
  });
}
