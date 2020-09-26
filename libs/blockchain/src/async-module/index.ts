export abstract class AsyncModule<TOptions> {
  static OPTIONS_TOKEN: string
  abstract createProviders(options: TOptions)

  public static forRoot(options: any) {
    this.createProviders(options)

  }

}