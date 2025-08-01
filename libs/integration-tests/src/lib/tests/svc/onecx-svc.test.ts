import { POSTGRES, KEYCLOAK, onecxSvcImages } from '../../config/env'
import { Network, StartedNetwork } from 'testcontainers'
import { OnecxKeycloakContainer, StartedOnecxKeycloakContainer } from '../../containers/core/onecx-keycloak'
import { OnecxPostgresContainer, StartedOnecxPostgresContainer } from '../../containers/core/onecx-postgres'
import { DummySvcContainer, StartedDummySvcContainer } from './onecx-dummy-svc'

xdescribe('Svc Testcontainer with worpsace-svc image', () => {
  let pgContainer: StartedOnecxPostgresContainer
  let kcContainer: StartedOnecxKeycloakContainer
  let dummyContainer: StartedDummySvcContainer
  let network: StartedNetwork

  beforeAll(async () => {
    try {
      network = await new Network().start()
      pgContainer = await new OnecxPostgresContainer(POSTGRES).withNetwork(network).start()
      kcContainer = await new OnecxKeycloakContainer(KEYCLOAK, pgContainer).withNetwork(network).start()
      dummyContainer = await new DummySvcContainer(onecxSvcImages.ONECX_WORKSPACE_SVC, pgContainer, kcContainer)
        .withNetwork(network)
        .start()
    } catch (error) {
      console.error('Failed to start containers:', error)
      // Cleanup on failure
      try {
        if (dummyContainer) await dummyContainer.stop()
        if (kcContainer) await kcContainer.stop()
        if (pgContainer) await pgContainer.stop()
        if (network) await network.stop()
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError)
      }
      throw error
    }
  })

  it('database should be created', async () => {
    await expect(pgContainer.doesDatabaseExist('onecx_dummy')).resolves.not.toBeTruthy()
  })

  it('should have expected environment variables in dummy-svc container', async () => {
    const environmentVariablesToCheck = [
      { name: 'QUARKUS_DATASOURCE_USERNAME', expected: '' },
      { name: 'QUARKUS_DATASOURCE_PASSWORD', expected: '' },
      { name: 'KC_REALM', expected: 'onecx' },
      { name: 'TKIT_OIDC_HEALTH_ENABLED', expected: 'false' },
      { name: 'TKIT_DATAIMPORT_ENABLED', expected: 'true' },
    ]

    for (const { name, expected } of environmentVariablesToCheck) {
      const execResult = await dummyContainer.exec(['printenv', name])
      const output = execResult.output.trim()

      expect(output).toContain(expected)
    }
  })

  it('should use the correct port', () => {
    const port = dummyContainer.getPort()

    expect(port).toBe(8080)
  })

  afterAll(async () => {
    const stopPromises = []

    try {
      if (dummyContainer)
        stopPromises.push(dummyContainer.stop().catch((e) => console.warn('Failed to stop dummy service:', e)))
      if (kcContainer) stopPromises.push(kcContainer.stop().catch((e) => console.warn('Failed to stop Keycloak:', e)))
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
