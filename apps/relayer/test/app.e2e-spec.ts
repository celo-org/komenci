describe('AppController (e2e)', () => {
  // let app: INestApplication
  // let client: ClientProxy

  beforeEach(async () => {
    // TODO: this doesn't currently work
    // Ganache setup needs to be more complex to hydrate a valid chain state

    // const moduleFixture: TestingModule = await Test.createTestingModule({
    //   imports: [
    //     ToolsModule,
    //     ClientsModule.register([
    //       { name: 'RELAYER_SERVICE', transport: Transport.TCP },
    //     ]),
    //   ]
    // }).overrideProvider(WEB3_PROVIDER).useValue(provider).compile()

    // app = moduleFixture.createNestApplication()
    // app.connectMicroservice({
    //   transport: Transport.TCP,
    // })

    // await app.startAllMicroservicesAsync()
    // await app.init()

    // client = app.get('RELAYER_SERVICE')
    // await client.connect()
  })

  it('is an empty test', () => {
    expect(true).toBeTruthy()
  })
})
