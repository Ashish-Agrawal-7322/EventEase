import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../../data/db.json');

// Ensure data folder exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class MemoryStore {
  constructor() {
    this.data = {
      users: [],
      events: [],
      registrations: []
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.users) this.data.users = [];
        if (!this.data.events) this.data.events = [];
        if (!this.data.registrations) this.data.registrations = [];
      }
    } catch (err) {
      console.error('Error loading db.json:', err.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing db.json:', err.message);
    }
  }

  generateId() {
    return Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
  }

  createModel(collectionName) {
    const store = this;

    class ModelInstance {
      constructor(data) {
        Object.assign(this, data);
        if (!this._id && !this.id) {
          this._id = store.generateId();
          this.id = this._id;
        } else if (this._id && !this.id) {
          this.id = this._id;
        }
        if (!this.createdAt) this.createdAt = new Date().toISOString();
        if (!this.updatedAt) this.updatedAt = new Date().toISOString();
      }

      async save() {
        const items = store.data[collectionName];
        this.updatedAt = new Date().toISOString();
        const index = items.findIndex(item => item._id === this._id || item.id === this._id);
        const plainData = JSON.parse(JSON.stringify(this));
        if (index >= 0) {
          items[index] = plainData;
        } else {
          items.push(plainData);
        }
        store.save();
        return this;
      }
    }

    class QueryChain {
      constructor(items) {
        this.items = items;
      }

      sort(sortObj) {
        if (!sortObj) return this;
        const key = Object.keys(sortObj)[0];
        const order = sortObj[key] === -1 || sortObj[key] === 'desc' ? -1 : 1;
        this.items.sort((a, b) => {
          if (a[key] < b[key]) return -1 * order;
          if (a[key] > b[key]) return 1 * order;
          return 0;
        });
        return this;
      }

      limit(count) {
        this.items = this.items.slice(0, count);
        return this;
      }

      select(fields) {
        return this;
      }

      populate(field) {
        if (field === 'organizer' && collectionName === 'events') {
          this.items = this.items.map(item => {
            const org = store.data.users.find(u => u._id === item.organizer || u.id === item.organizer);
            return { ...item, organizer: org ? { _id: org._id, name: org.name, email: org.email } : item.organizer };
          });
        }
        if (field === 'event' && collectionName === 'registrations') {
          this.items = this.items.map(item => {
            const ev = store.data.events.find(e => e._id === item.event || e.id === item.event);
            return { ...item, event: ev || item.event };
          });
        }
        if (field === 'user' && collectionName === 'registrations') {
          this.items = this.items.map(item => {
            const u = store.data.users.find(usr => usr._id === item.user || usr.id === item.user);
            return { ...item, user: u ? { _id: u._id, name: u.name, email: u.email, rollNumber: u.rollNumber } : item.user };
          });
        }
        return this;
      }

      lean() {
        return this.items.map(item => JSON.parse(JSON.stringify(item)));
      }

      then(resolve, reject) {
        return Promise.resolve(this.items.map(item => new ModelInstance(item))).then(resolve, reject);
      }
    }

    class SingleQueryChain {
      constructor(item) {
        this.item = item ? JSON.parse(JSON.stringify(item)) : null;
      }

      select(fields) {
        return this;
      }

      populate(field) {
        if (!this.item) return this;
        if (field === 'organizer' && collectionName === 'events') {
          const org = store.data.users.find(u => u._id === this.item.organizer || u.id === this.item.organizer);
          this.item.organizer = org ? { _id: org._id, name: org.name, email: org.email } : this.item.organizer;
        }
        if (field === 'event' && collectionName === 'registrations') {
          const ev = store.data.events.find(e => e._id === this.item.event || e.id === this.item.event);
          this.item.event = ev || this.item.event;
        }
        if (field === 'user' && collectionName === 'registrations') {
          const u = store.data.users.find(usr => usr._id === this.item.user || usr.id === this.item.user);
          this.item.user = u ? { _id: u._id, name: u.name, email: u.email, rollNumber: u.rollNumber } : this.item.user;
        }
        return this;
      }

      lean() {
        return this.item ? JSON.parse(JSON.stringify(this.item)) : null;
      }

      then(resolve, reject) {
        return Promise.resolve(this.item ? new ModelInstance(this.item) : null).then(resolve, reject);
      }
    }

    const matchesFilter = (item, filter) => {
      if (!filter || Object.keys(filter).length === 0) return true;
      for (const [key, value] of Object.entries(filter)) {
        if (key === '$or' && Array.isArray(value)) {
          const matched = value.some(subFilter => matchesFilter(item, subFilter));
          if (!matched) return false;
          continue;
        }

        if (key === '_id' || key === 'id') {
          const itemId = item._id || item.id;
          const targetId = typeof value === 'object' && value ? value.toString() : value;
          if (itemId !== targetId) return false;
          continue;
        }

        if (value instanceof RegExp) {
          if (!value.test(item[key] || '')) return false;
          continue;
        }

        if (typeof value === 'object' && value !== null) {
          if (value.$regex) {
            const reg = new RegExp(value.$regex, value.$options || 'i');
            if (!reg.test(item[key] || '')) return false;
            continue;
          }
          if (value.$in && Array.isArray(value.$in)) {
            if (!value.$in.includes(item[key])) return false;
            continue;
          }
          if (value.$gte !== undefined && item[key] < value.$gte) return false;
          if (value.$lte !== undefined && item[key] > value.$lte) return false;
        } else if (item[key] !== value) {
          return false;
        }
      }
      return true;
    };

    return {
      find(filter = {}) {
        const matched = store.data[collectionName].filter(item => matchesFilter(item, filter));
        return new QueryChain(matched);
      },

      findOne(filter = {}) {
        const item = store.data[collectionName].find(item => matchesFilter(item, filter));
        return new SingleQueryChain(item);
      },

      findById(id) {
        const targetId = typeof id === 'object' && id ? id.toString() : id;
        const item = store.data[collectionName].find(item => item._id === targetId || item.id === targetId);
        return new SingleQueryChain(item);
      },

      async create(doc) {
        const instance = new ModelInstance(doc);
        store.data[collectionName].push(JSON.parse(JSON.stringify(instance)));
        store.save();
        return instance;
      },

      async insertMany(docs) {
        const instances = docs.map(doc => {
          const inst = new ModelInstance(doc);
          return JSON.parse(JSON.stringify(inst));
        });
        store.data[collectionName].push(...instances);
        store.save();
        return instances.map(i => new ModelInstance(i));
      },

      async findByIdAndUpdate(id, update, options = { new: true }) {
        const targetId = typeof id === 'object' && id ? id.toString() : id;
        const index = store.data[collectionName].findIndex(item => item._id === targetId || item.id === targetId);
        if (index === -1) return null;

        const current = store.data[collectionName][index];
        const updatedFields = update.$set ? { ...update.$set } : { ...update };
        delete updatedFields.$set;

        if (update.$inc) {
          for (const [key, val] of Object.entries(update.$inc)) {
            updatedFields[key] = (current[key] || 0) + val;
          }
        }

        const merged = { ...current, ...updatedFields, updatedAt: new Date().toISOString() };
        store.data[collectionName][index] = merged;
        store.save();
        return new ModelInstance(merged);
      },

      async findByIdAndDelete(id) {
        const targetId = typeof id === 'object' && id ? id.toString() : id;
        const index = store.data[collectionName].findIndex(item => item._id === targetId || item.id === targetId);
        if (index === -1) return null;
        const removed = store.data[collectionName].splice(index, 1)[0];
        store.save();
        return new ModelInstance(removed);
      },

      async deleteMany(filter = {}) {
        if (Object.keys(filter).length === 0) {
          const count = store.data[collectionName].length;
          store.data[collectionName] = [];
          store.save();
          return { deletedCount: count };
        }
        const initialCount = store.data[collectionName].length;
        store.data[collectionName] = store.data[collectionName].filter(item => !matchesFilter(item, filter));
        store.save();
        return { deletedCount: initialCount - store.data[collectionName].length };
      },

      async countDocuments(filter = {}) {
        return store.data[collectionName].filter(item => matchesFilter(item, filter)).length;
      }
    };
  }
}

export const memoryStore = new MemoryStore();
