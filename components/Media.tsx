import {createMedia} from "@artsy/fresnel"

const AppMedia = createMedia({
  breakpoints: {
    sm: 0,
    md: 400,
    lg: 640,
    xl: 1192,
  },
})

export const mediaStyle = AppMedia.createMediaStyle()
export const {Media, MediaContextProvider} = AppMedia
