# Commands

Commands representan intenciones del usuario de realizar acciones que modifican el estado.

## Ejemplo:

```typescript
export class CreateMicroAuthCommand {
  constructor(
    public readonly email: string,
    public readonly name: string
  ) {}
}
```
