import { EventDispatcher } from '../../../events'

export interface DataSourceState {
  connecting: boolean
  connected: boolean
  error?: string
  protocolVersion?: 3 | 4 | 5 // the version actually negotiated, which "Auto" only knows once connected
}

export class DataSourceStateMachine {
  public onUpdate = new EventDispatcher<DataSourceState>()
  private state: DataSourceState = {
    error: undefined,
    connected: false,
    connecting: false,
  }

  public setConnected(connected: boolean, protocolVersion?: 3 | 4 | 5) {
    this.state = {
      connected,
      error: undefined,
      connecting: false,
      protocolVersion,
    }
    this.onUpdate.dispatch(this.state)
  }

  public setError(error: Error) {
    this.state = {
      ...this.state,
      error: error.message,
      // connected: false,
      // connecting: false,
    }
    this.onUpdate.dispatch(this.state)
  }

  public setConnecting() {
    this.state = {
      ...this.state,
      connected: false,
      connecting: true,
    }
    this.onUpdate.dispatch(this.state)
  }

  public toJSON() {
    return this.state
  }
}
