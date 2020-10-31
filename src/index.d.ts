declare module 'wkhtmltopdf' {
  declare function wkhtmltopdf (stream: NodeJS.ReadableStream, ...rest: any[]): NodeJS.ReadableStream
  declare namespace wkhtmltopdf {}

  export default wkhtmltopdf
}
