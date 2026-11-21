import {SearchField} from './search-field';

describe('SearchField', () => {
  // SearchField is an interface (an API row shape), so there is no instance to construct
  it('should describe a field search row', () => {
    const row: SearchField = {fieldId: 1, name: 'Month End'};
    expect(row.name).toBe('Month End');
  });
});
