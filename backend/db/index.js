const Datastore = require('nedb');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data');
const fs = require('fs');
if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

const db = {
    users: new Datastore({ filename: path.join(dbPath, 'users.db'), autoload: true }),
    projects: new Datastore({ filename: path.join(dbPath, 'projects.db'), autoload: true }),
    tasks: new Datastore({ filename: path.join(dbPath, 'tasks.db'), autoload: true }),
    memberships: new Datastore({ filename: path.join(dbPath, 'memberships.db'), autoload: true }),
};

// Create indexes
db.users.ensureIndex({ fieldName: 'email', unique: true });
db.memberships.ensureIndex({ fieldName: 'projectId' });
db.memberships.ensureIndex({ fieldName: 'userId' });
db.tasks.ensureIndex({ fieldName: 'projectId' });

// Promisify db operations
const promisify = (db) => ({
    find: (query, sort) => new Promise((res, rej) => {
        const cursor = db.find(query);
        if (sort) cursor.sort(sort);
        cursor.exec((err, docs) => err ? rej(err) : res(docs));
    }),
    findOne: (query) => new Promise((res, rej) => db.findOne(query, (err, doc) => err ? rej(err) : res(doc))),
    insert: (doc) => new Promise((res, rej) => db.insert(doc, (err, newDoc) => err ? rej(err) : res(newDoc))),
    update: (query, update, opts = {}) => new Promise((res, rej) => db.update(query, update, opts, (err, n, docs) => err ? rej(err) : res(docs || n))),
    remove: (query, opts = {}) => new Promise((res, rej) => db.remove(query, opts, (err, n) => err ? rej(err) : res(n))),
    count: (query) => new Promise((res, rej) => db.count(query, (err, n) => err ? rej(err) : res(n))),
});

module.exports = {
    users: promisify(db.users),
    projects: promisify(db.projects),
    tasks: promisify(db.tasks),
    memberships: promisify(db.memberships),
};