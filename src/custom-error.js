class CustomError extends Error {
  constructor ({ message, type } = {}) {
    super()

    this.type = type
    this.message = message
  }
}

export default CustomError
