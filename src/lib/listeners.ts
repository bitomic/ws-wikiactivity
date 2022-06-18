import { ListenerStore } from './framework'
import path from 'path'

export const listeners = new ListenerStore().registerPath( path.resolve( __dirname, '..', 'listeners' ) )
