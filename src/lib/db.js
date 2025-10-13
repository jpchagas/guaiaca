import { openDB } from 'idb'
import { v4 as uuidv4 } from 'uuid'


const DB_NAME = 'couples-finances'
const DB_VERSION = 1


export async function initDB() {
    const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(upgradeDb) {
            if (!upgradeDb.objectStoreNames.contains('transactions')) {
                upgradeDb.createObjectStore('transactions', { keyPath: 'id' })
            }
            if (!upgradeDb.objectStoreNames.contains('budgets')) {
                upgradeDb.createObjectStore('budgets', { keyPath: 'id' })
            }
            if (!upgradeDb.objectStoreNames.contains('syncQueue')) {
                upgradeDb.createObjectStore('syncQueue', { keyPath: 'id' })
            }
        }
    })
    return db
}


export async function saveTransactionLocally(tx) {
    const db = await initDB()
    const id = tx.id || uuidv4()
    const record = { ...tx, id }
    await db.put('transactions', record)
    await db.put('syncQueue', { id, type: 'transaction', payload: record })
    return id
}


export async function getAllTransactions() {
    const db = await initDB()
    return db.getAll('transactions')
}


export async function getBudgets() {
    const db = await initDB()
    return db.getAll('budgets')
}


export async function saveBudget(b) {
    const db = await initDB()
    const id = b.id || uuidv4()
    const record = { ...b, id }
    await db.put('budgets', record)
    return id
}


export async function popSyncQueue() {
    const db = await initDB()
    const all = await db.getAll('syncQueue')
    await Promise.all(all.map(i => db.delete('syncQueue', i.id)))
    return all
}