// @flow
import isFunction from './isFunction'
import isPlainObject from './isPlainObject'
import isStyledComponent from './isStyledComponent'
import Keyframes from '../models/Keyframes'
import hyphenate from '../utils/hyphenateStyleName'

export const objToCss = (obj: Object, prevKey?: string): string => {
  const css = Object.keys(obj)
    .filter(key => {
      const chunk = obj[key]
      return (
        chunk !== undefined && chunk !== null && chunk !== false && chunk !== ''
      )
    })
    .map(key => {
      if (isPlainObject(obj[key])) return objToCss(obj[key], key)
      return `${hyphenate(key)}: ${obj[key]};`
    })
    .join(' ')
  return prevKey
    ? `${prevKey} {
  ${css}
}`
    : css
}

/**
 * It's falsish not falsy because 0 is allowed.
 */
const isFalsish = chunk =>
  chunk === undefined || chunk === null || chunk === false || chunk === ''

export default function flatten(
  chunk: any,
  executionContext: ?Object,
  styleSheet: ?Object
): any {
  if (Array.isArray(chunk)) {
    const ruleSet = []

    for (let i = 0, len = chunk.length, result; i < len; i += 1) {
      result = flatten(chunk[i], executionContext, styleSheet)

      if (result === null) continue
      else if (Array.isArray(result)) ruleSet.push(...result)
      else ruleSet.push(result)
    }

    return ruleSet
  }

  if (isFalsish(chunk)) {
    return null
  }

  /* Handle other components */
  if (isStyledComponent(chunk)) {
    return `.${chunk.styledComponentId}`
  }

  /* Either execute or defer the function */
  if (isFunction(chunk)) {
    if (executionContext) {
      return flatten(chunk(executionContext), executionContext, styleSheet)
    } else return chunk
  }

  if (chunk instanceof Keyframes) {
    if (styleSheet) {
      chunk.inject(styleSheet)
      return chunk.getName()
    } else return chunk
  }

  /* Handle objects */
  return isPlainObject(chunk) ? objToCss(chunk) : chunk.toString()
}
