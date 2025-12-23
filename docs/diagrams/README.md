Diagrams for the project

Files:
- folder-structure.puml — PlantUML source for repository folder tree
- architecture-c4.puml — PlantUML source for C4-style container diagram

How to render to SVG (requires docker or local PlantUML):

Using Docker (PowerShell):

# from repo root (Windows PowerShell)
PS> docker run --rm -v ${PWD}:/workspace plantuml/plantuml -tsvg docs/diagrams/folder-structure.puml
PS> docker run --rm -v ${PWD}:/workspace plantuml/plantuml -tsvg docs/diagrams/architecture-c4.puml

Or using plantuml.jar (if installed):

java -jar plantuml.jar -tsvg docs/diagrams/folder-structure.puml
java -jar plantuml.jar -tsvg docs/diagrams/architecture-c4.puml

Notes:
- Rendering requires Java and PlantUML; Docker image `plantuml/plantuml` is a convenient option.
- After rendering, the generated `*.svg` files will be created in `docs/diagrams/`.
