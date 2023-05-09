import {vivenu} from "@vivenu/vivenu-js"
import getConfig from "next/config"

const {publicRuntimeConfig} = getConfig()

export function APIClient(apiKey?: string) {
  return vivenu({
    core: publicRuntimeConfig.CORE_SERVICE,
    apiKey,
  })
}
