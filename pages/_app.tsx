import "../styles/globals.css"
import "../less/app.less"

import type {AppProps} from "next/app"
import {MediaContextProvider} from "../components/Media"

export default function MyApp({Component, pageProps}: AppProps) {
  //@ts-ignore
  const children = <Component {...pageProps} />
  //@ts-ignore
  return <MediaContextProvider>{children}</MediaContextProvider>
}
