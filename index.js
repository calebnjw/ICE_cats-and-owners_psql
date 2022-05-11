// SELECT * FROM [table] (WHERE [column]=[value]);
// SELECT * FROM [table] ORDER BY [column] ASC/DESC;
// INSERT INTO [table] ([column], [column]) VALUES ([value], [value]);
// UPDATE [table] SET [column]=[value] WHERE [column]=[value];
// DELETE FROM [table] WHERE [column]=[value];
// ALTER TABLE [table] Change [column] [newName] [type];

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
  const query = `SELECT cats.cat_name, cats.owner_id, cat_owners.id, cat_owners.owner_name 
  FROM cats
  INNER JOIN cat_owners
  ON cats.owner_id=cat_owners.id;`;

  pool.query(query, (error, result) => {
    console.log('Getting Cats');

    if (error) {
      console.log(error);
      return;
    }

    result.rows.forEach((cat) => {
      console.log(`${cat.cat_name}: ${cat.owner_name}`);
    });
  });
}

if (action === 'owners') {
  const query = `SELECT cats.cat_name, cats.owner_id, cat_owners.id, cat_owners.owner_name 
  FROM cats
  INNER JOIN cat_owners
  ON cats.owner_id=cat_owners.id;`;

  pool.query(query, (error, result) => {
    console.log('Getting Owners');

    if (error) {
      console.log(error);
      return;
    }

    // new object to store cats grouped by owner_id
    // owner_name is the key, value will be an array with cat names
    const catsByOwner = {};
    result.rows.forEach((cat) => {
      // if the owner is not registered in the array,
      if (catsByOwner[cat.owner_name] === undefined) {
        // create new key:value pair, with the value stored in an array
        catsByOwner[cat.owner_name] = [cat.cat_name];
      } else {
        // else append cat name to the end of the existing list
        catsByOwner[cat.owner_name].push(cat.cat_name);
      }
    });

    // get the list of owners from the object
    const owners = Object.keys(catsByOwner);
    const catCount = process.argv[3];

    if (process.argv[3]) {
      console.log(process.argv[3]);
      owners.forEach((owner) => {
        if (catsByOwner[owner].length === Number(process.argv[3])) {
          console.log(`- ${owner}`);
          catsByOwner[owner].forEach((cat) => {
            console.log(`  - ${cat}`);
          });
        }
        // else {
        //   console.log(`Nobody has ${process.argv[3]} cats.`);
        // }
      });
    } else {
      owners.forEach((owner) => {
        console.log(`- ${owner}`);
        // iterate through each array to get cat
        catsByOwner[owner].forEach((cat) => {
          console.log(`  - ${cat}`);
        });
      });
    }
  });
}
