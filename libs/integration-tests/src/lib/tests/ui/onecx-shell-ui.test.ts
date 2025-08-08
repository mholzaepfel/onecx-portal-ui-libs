import { POSTGRES, KEYCLOAK, onecxShellUiImages } from '../../config/env'
import { Network, StartedNetwork } from 'testcontainers'
import { OnecxKeycloakContainer, StartedOnecxKeycloakContainer } from '../../containers/core/onecx-keycloak'
import { OnecxPostgresContainer, StartedOnecxPostgresContainer } from '../../containers/core/onecx-postgres'
import { ShellUiContainer, StartedShellUiContainer } from '../../containers/ui/onecx-shell-ui'

xdescribe('Default workspace-svc Testcontainer', () => {
  let pgContainer: StartedOnecxPostgresContainer
  let kcContainer: StartedOnecxKeycloakContainer
  let shellUiContainer: StartedShellUiContainer
  let network: StartedNetwork

  beforeAll(async () => {
    try {
      // Create network (testcontainers will assign unique names automatically when parallel)
      network = await new Network().start()

      // Start containers with unique names and network
      pgContainer = await new OnecxPostgresContainer(POSTGRES).withNetwork(network).start()

      kcContainer = await new OnecxKeycloakContainer(KEYCLOAK, pgContainer).withNetwork(network).start()

      shellUiContainer = await new ShellUiContainer(onecxShellUiImages.ONECX_SHELL_UI, kcContainer)
        .withNetwork(network)
        .start()
    } catch (error) {
      console.error('Failed to start containers:', error)
      // Cleanup on failure
      try {
        if (shellUiContainer) await shellUiContainer.stop()
        if (kcContainer) await kcContainer.stop()
        if (pgContainer) await pgContainer.stop()
        if (network) await network.stop()
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError)
      }
      throw error
    }
  })

  it('should have expected environment variables in permission-svc container, KC_REALM', async () => {
    const execResult = await shellUiContainer.exec(['printenv', 'KC_REALM'])
    const output = execResult.output.trim()

    expect(output).toContain('onecx')
  })

  it('should have expected environment variables in permission-svc container, TKIT_OIDC_HEALTH_ENABLED', async () => {
    const execResult = await shellUiContainer.exec(['printenv', 'TKIT_OIDC_HEALTH_ENABLED'])
    const output = execResult.output.trim()

    expect(output).toContain('false')
  })

  it('should have expected environment variables in permission-svc container, CLIENT_USER_ID', async () => {
    const execResult = await shellUiContainer.exec(['printenv', 'CLIENT_USER_ID'])
    const output = execResult.output.trim()

    expect(output).toContain('onecx-shell-ui-client')
  })

  it('should have expected environment variables in permission-svc container, ONECX_VAR_REMAP', async () => {
    const execResult = await shellUiContainer.exec(['printenv', 'ONECX_VAR_REMAP'])
    const output = execResult.output.trim()

    expect(output).toContain('KEYCLOAK_REALM=KC_REALM;KEYCLOAK_CLIENT_ID=CLIENT_USER_ID')
  })

  afterAll(async () => {
    const stopPromises = []

    try {
      if (shellUiContainer)
        stopPromises.push(shellUiContainer.stop().catch((e) => console.warn('Failed to stop shell UI:', e)))
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
