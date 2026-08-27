import { parseLinkFilters } from '@/utils/fieldTransforms'

describe('parseLinkFilters', () => {
  it('returns null for falsy input', () => {
    expect(parseLinkFilters(null)).toBeNull()
    expect(parseLinkFilters(undefined)).toBeNull()
    expect(parseLinkFilters('')).toBeNull()
    expect(parseLinkFilters(0)).toBeNull()
  })

  it('parses a valid JSON string', () => {
    expect(parseLinkFilters('{"company":"ACME"}')).toEqual({ company: 'ACME' })
  })

  it('returns object as-is if already an object', () => {
    const obj = { company: 'ACME', enabled: 1 }
    expect(parseLinkFilters(obj)).toBe(obj)
  })

  it('returns null for invalid JSON string', () => {
    expect(parseLinkFilters('not json')).toBeNull()
  })

  it('normalizes list-format link filter conditions to dict', () => {
    expect(parseLinkFilters('[["User","role","=","Sales Manager"]]')).toEqual({
      role: ['=', 'Sales Manager'],
    })
  })
})
