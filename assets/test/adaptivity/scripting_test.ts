import { evalScript, getAssignScript, getValue } from 'adaptivity/scripting';
import { Environment } from 'janus-script';

describe('Scripting Interface', () => {
  describe('getValue', () => {
    it('should get the direct value for a scripting variable', () => {
      const environment = new Environment();
      evalScript('let x = "42";', environment);

      const value = getValue('x', environment);
      expect(value).toBe('42');
    });
  });

  describe('evalScript', () => {
    it('should return a reference to the environment', () => {
      const environment = new Environment();
      const result = evalScript('let x = "42";', environment);
      expect(result.env).toBe(environment);
    });
  });

  describe('getAssignScript', () => {
    it('should return a script that assigns a value to a variable', () => {
      const environment = new Environment();
      const script = getAssignScript({ x: 42 });
      const result = evalScript(script, environment);
      const value = getValue('x', environment);
      expect(script).toBe('let {x} = 42;');
      expect(result.result).toBe(null);
      expect(value).toBe(42);
    });

    it('should return an assignment script from a capi-like variable', () => {
      const environment = new Environment();
      const script = getAssignScript({ x: { key: 'x', path: 'stage.x', value: 42 } });
      const result = evalScript(script, environment);
      const value = getValue('stage.x', environment);
      expect(script).toBe('let {stage.x} = 42;');
      expect(result.result).toBe(null);
      expect(value).toBe(42);
    });
  });
});
