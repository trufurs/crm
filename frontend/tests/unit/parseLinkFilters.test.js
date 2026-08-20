import { parseLinkFilters } from '@/utils/fieldTransforms'

describe('parseLinkFilters', () => {
  it('returns null for falsy input', () => {
    expect(parseLinkFilters(null)).toBeNull()
    expect(parseLinkFilters(undefined)).toBeNull()
    expect(parseLinkFilters('')).toBeNull()
    expect(parseLinkFilters(0)).toBeNull()
  })

  it('returns null for invalid JSON string', () => {
    expect(parseLinkFilters('not json')).toBeNull()
  })

  it('converts the stored 4-tuple list into a filter mapping', () => {
    // search_link needs { fieldname: [operator, value] }; handing it the stored
    // list fails for doctypes with a standard_queries hook (User).
    const stored =
      '[["User","user_type","=","System User"],["User","name","like","%@example.com"]]'
    expect(parseLinkFilters(stored)).toEqual({
      user_type: ['=', 'System User'],
      name: ['like', '%@example.com'],
    })
  })

  it('accepts an already-parsed list', () => {
    expect(
      parseLinkFilters([['Contact', 'link_doctype', '=', 'Customer']]),
    ).toEqual({ link_doctype: ['=', 'Customer'] })
  })

  it('returns a mapping as-is, so it stays idempotent', () => {
    // The Link->User branches write a mapping back into field.link_filters and
    // then re-read it. Legacy dict-shaped data lands here too.
    const legacy = { company: 'ACME', enabled: 1 }
    expect(parseLinkFilters(legacy)).toBe(legacy)
    expect(parseLinkFilters('{"company":"ACME"}')).toEqual({ company: 'ACME' })

    const once = parseLinkFilters('[["User","user_type","=","System User"]]')
    expect(parseLinkFilters(once)).toEqual(once)
  })

  it('resolves eval: values against the doc context', () => {
    // The server never resolves eval: — it would match the literal string.
    const stored =
      '[["Contact","link_doctype","=","Customer"],["Contact","link_name","=","eval:doc.customer"]]'
    expect(parseLinkFilters(stored, { doc: { customer: 'ACME' } })).toEqual({
      link_doctype: ['=', 'Customer'],
      link_name: ['=', 'ACME'],
    })
  })

  it('degrades to {} when an eval: value cannot be resolved', () => {
    // Matches desk's apply_link_field_filters(), which catches and returns {}.
    expect(
      parseLinkFilters('[["Contact","link_name","=","eval:doc.x"]]'),
    ).toEqual({})
  })

  it('degrades to {} for a list of non-tuples rather than throwing', () => {
    expect(parseLinkFilters('[1,2]')).toEqual({})
  })

  it('produces a spreadable mapping for the Link->User branch', () => {
    // Spreading the raw *list* here yielded "0"/"1" numeric keys, which the
    // server rejected with "too many values to unpack".
    const merged = {
      name: ['in', ['a@example.com']],
      ignore_user_type: 1,
      ...(parseLinkFilters('[["User","user_type","=","System User"]]') || {}),
    }
    expect(Object.keys(merged).sort()).toEqual([
      'ignore_user_type',
      'name',
      'user_type',
    ])
  })
})
