# Commands

Commands representan intenciones del usuario de realizar acciones que modifican el estado.

## Ejemplo:

```typescript
export class CreateMicroNotificacionesCommand {
  constructor(
    public readonly email: string,
    public readonly name: string
  ) {}
}
```
