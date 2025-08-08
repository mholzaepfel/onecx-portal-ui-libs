import { POSTGRES, KEYCLOAK, onecxSvcImages } from '../../config/env'
import { Network, StartedNetwork } from 'testcontainers'
import { OnecxKeycloakContainer, StartedOnecxKeycloakContainer } from '../../containers/core/onecx-keycloak'
import { OnecxPostgresContainer, StartedOnecxPostgresContainer } from '../../containers/core/onecx-postgres'
import { PermissionSvcContainer, StartedPermissionSvcContainer } from '../../containers/svc/onecx-permission-svc'
import axios from 'axios'
import { TenantSvcContainer, StartedTenantSvcContainer } from '../../containers/svc/onecx-tenant-svc'

xdescribe('Default workspace-svc Testcontainer', () => {
  jest.mock('axios')
  let pgContainer: StartedOnecxPostgresContainer
  let kcContainer: StartedOnecxKeycloakContainer
  let permissionSvcContainer: StartedPermissionSvcContainer
  let tenantSvcContainer: StartedTenantSvcContainer
  let network: StartedNetwork

  beforeAll(async () => {
    try {
      network = await new Network().start()
      pgContainer = await new OnecxPostgresContainer(POSTGRES).withNetwork(network).start()
      kcContainer = await new OnecxKeycloakContainer(KEYCLOAK, pgContainer).withNetwork(network).start()
      tenantSvcContainer = await new TenantSvcContainer(onecxSvcImages.ONECX_TENANT_SVC, pgContainer, kcContainer)
        .withNetwork(network)
        .start()
      permissionSvcContainer = await new PermissionSvcContainer(
        onecxSvcImages.ONECX_PERMISSION_SVC,
        pgContainer,
        kcContainer,
        tenantSvcContainer
      )
        .withNetwork(network)
        .start()
    } catch (error) {
      console.error('Failed to start containers:', error)
      // Cleanup on failure
      try {
        if (permissionSvcContainer) await permissionSvcContainer.stop()
        if (tenantSvcContainer) await tenantSvcContainer.stop()
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
    await expect(pgContainer.doesDatabaseExist('onecx_permission')).resolves.not.toBeTruthy()
  })

  it('should respond with 200 on /q/health', async () => {
    const port = permissionSvcContainer.getMappedPort(permissionSvcContainer.getPort())
    const response = axios.get(`http://localhost:${port}/q/health`)

    expect((await response).status).toBe(200)
  })

  it('should use the correct port', () => {
    const port = permissionSvcContainer.getPort()

    expect(port).toBe(8080)
  })

  afterAll(async () => {
    const stopPromises = []

    try {
      if (permissionSvcContainer)
        stopPromises.push(
          permissionSvcContainer.stop().catch((e) => console.warn('Failed to stop permission service:', e))
        )
      if (tenantSvcContainer)
        stopPromises.push(tenantSvcContainer.stop().catch((e) => console.warn('Failed to stop tenant service:', e)))
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
