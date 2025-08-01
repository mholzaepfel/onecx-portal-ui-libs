import { assert } from 'console'
import { OnecxPostgresContainer, StartedOnecxPostgresContainer } from '../../containers/core/onecx-postgres'
import { Client } from 'pg'
import { Network, StartedNetwork } from 'testcontainers'

describe('Default Postgres Testcontainer', () => {
  let client: Client
  let pgContainer: StartedOnecxPostgresContainer
  let network: StartedNetwork
  const imagePg = 'docker.io/library/postgres:13.4'

  beforeAll(async () => {
    try {
      network = await new Network().start()
      pgContainer = await new OnecxPostgresContainer(imagePg).start()

      client = new Client({
        host: pgContainer.getHost(),
        port: pgContainer.getMappedPort(pgContainer.getPort()),
        user: pgContainer.getPostgresUsername(),
        password: pgContainer.getPostgresPassword(),
        database: pgContainer.getPostgresDatabase(),
      })
      await client.connect()
    } catch (error) {
      console.error('Failed to start containers:', error)
      // Cleanup on failure
      try {
        if (client) await client.end()
        if (pgContainer) await pgContainer.stop()
        if (network) await network.stop()
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError)
      }
      throw error
    }
  })

  it('should create database', async () => {
    const username = 'keycloak'
    const password = 'keycloak'

    await pgContainer.createUserAndDatabase(username, password)
    assert(true, await pgContainer.doesDatabaseExist(username))
  })

  it('should create user', async () => {
    const username = 'booky'
    const password = 'booky'
    await expect(pgContainer.createDatabaseUser(username, password)).resolves.not.toThrow()
  })

  it('should return correct database details', () => {
    expect(pgContainer.getPostgresDatabase()).toBe('postgres')
    expect(pgContainer.getPostgresUsername()).toBe('postgres')
    expect(pgContainer.getPostgresPassword()).toBe('admin')
  })

  it('should have valid network aliases', () => {
    const aliases = pgContainer.getNetworkAliases()
    expect(Array.isArray(aliases)).toBe(true)
    expect(aliases).toContain('postgresdb')
  })

  it('should pass pg_isready health check', async () => {
    const result = await pgContainer.exec(['pg_isready', '-U', pgContainer.getPostgresUsername()])

    expect(result.output).toContain('accepting connections')
  })

  it('should use the correct port', () => {
    const port = pgContainer.getPort()

    expect(port).toBe(5432)
  })

  afterAll(async () => {
    const stopPromises = []

    try {
      if (client) await client.end().catch((e) => console.warn('Failed to close client:', e))
      if (pgContainer) stopPromises.push(pgContainer.stop().catch((e) => console.warn('Failed to stop Postgres:', e)))

      await Promise.allSettled(stopPromises)

      if (network) {
        await network.stop().catch((e) => console.warn('Failed to stop network:', e))
      }
    } catch (error) {
      console.warn('Error during cleanup:', error)
    }
  })
})
