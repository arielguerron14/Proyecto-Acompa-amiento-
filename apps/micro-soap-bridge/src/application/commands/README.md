# Commands

Commands representan intenciones del usuario de realizar acciones que modifican el estado.

## Ejemplo:

```typescript
export class CreateMicroSoapBridgeCommand {
  constructor(
    public readonly email: string,
    public readonly name: string
  ) {}
}
```
