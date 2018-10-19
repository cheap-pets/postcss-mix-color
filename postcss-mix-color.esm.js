import postcss from 'postcss'
import balanced from 'balanced-match'
import Color from 'color'
import messageHelpers from 'postcss-message-helpers'

function mix (c1, c2, w) {
  if (arguments.length === 1) {
    return c1
  } else if (arguments.length === 2 && (c2.endsWith('%') || parseFloat(c2) <= 1)) {
    w = c2
    c2 = undefined
  }
  if (!w) w = '50%'
  const weight = (w.endsWith('%') ? w.replace('%', '') : w * 100) / 100
  return c2 ? Color(c1).mix(Color(c2), weight).string() : Color(c1).alpha(w).string()
}

function transformValue (string, source) {
  const idx = string.indexOf('mixc(')
  if (idx < 0) return string
  if (idx >= 0) {
    const pre = string.substr(0, idx)
    const s = string.substr(idx)
    const { body, post } = balanced('(', ')', s)
    if (!body) throw new Error(`unclosed bracket in "${string}"`, source)
    const color = mix.apply(null, body.split(/,\s*(?![^()]*\))/))
    return pre + color + transformValue(post, source)
  }
}

function transformDecl (decl) {
  if (decl.value && decl.value.indexOf('mixc(') > -1) {
    messageHelpers.try(
      () => {
        decl.value = transformValue(decl.value, decl.source)
      },
      decl.source
    )
  }
}

export default postcss.plugin('postcss-mix-color', () => style => {
  style.walkDecls(transformDecl)
})
