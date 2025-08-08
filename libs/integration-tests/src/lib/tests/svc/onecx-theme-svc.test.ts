import { POSTGRES, KEYCLOAK, onecxSvcImages } from '../../config/env'
import { Network, StartedNetwork } from 'testcontainers'
import { OnecxKeycloakContainer, StartedOnecxKeycloakContainer } from '../../containers/core/onecx-keycloak'
import { OnecxPostgresContainer, StartedOnecxPostgresContainer } from '../../containers/core/onecx-postgres'
import { ThemeSvcContainer, StartedThemeSvcContainer } from '../../containers/svc/onecx-theme-svc'
import axios from 'axios'

xdescribe('Default workspace-svc Testcontainer', () => {
  let pgContainer: StartedOnecxPostgresContainer
  let kcContainer: StartedOnecxKeycloakContainer
  let themeSvcContainer: StartedThemeSvcContainer
  let network: StartedNetwork

  beforeAll(async () => {
    try {
      network = await new Network().start()
      pgContainer = await new OnecxPostgresContainer(POSTGRES).withNetwork(network).start()
      kcContainer = await new OnecxKeycloakContainer(KEYCLOAK, pgContainer).withNetwork(network).start()
      themeSvcContainer = await new ThemeSvcContainer(onecxSvcImages.ONECX_THEME_SVC, pgContainer, kcContainer)
        .withNetwork(network)
        .start()
    } catch (error) {
      console.error('Failed to start containers:', error)
      // Cleanup on failure
      try {
        if (themeSvcContainer) await themeSvcContainer.stop()
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
    await expect(pgContainer.doesDatabaseExist('onecx_theme')).resolves.not.toBeTruthy()
  })

  it('should respond with 200 on /q/health', async () => {
    const port = themeSvcContainer.getMappedPort(themeSvcContainer.getPort())
    const response = axios.get(`http://localhost:${port}/q/health`)

    expect((await response).status).toBe(200)
  })

  it('should use the correct port', () => {
    const port = themeSvcContainer.getPort()

    expect(port).toBe(8080)
  })

  afterAll(async () => {
    const stopPromises = []

    try {
      if (themeSvcContainer)
        stopPromises.push(themeSvcContainer.stop().catch((e) => console.warn('Failed to stop theme service:', e)))
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
