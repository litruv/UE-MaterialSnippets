# UE Material Snippets

UE Material Snippets is a library of material snippets for use in Unreal Engine. Each material comes with a preview, snippet to copy, and description to help you choose the right one for extending functionality to your material.
I created this because I work on many different projects and often reuse similar material patterns. Instead of adding bulky material functions to every project, I streamlined the process by compiling small, easy-to-copy snippets.

## Materials

The materials are defined in the `materials.json` file. Each material has the following properties:
- `author`: The author of the material.
- `name`: The name of the material.
- `categories`: A list of categories the material belongs to.
- `preview`: A path to the preview image of the material.
- `snippet`: A path to the snippet file of the material.
- `description`: A brief description of the material.

## Usage

To copy a material snippet, click on the preview, and follow the description or comments in the nodes.

## Contributing

I welcome contributions! If you have a material snippet you'd like to add, please follow these steps:
1. Fork the repository.
2. Add your preview image to the `thumbnails` folder.
3. Add your snippet file to the `snippets` folder.
4. Add your material to the `materials.json` file.
5. Submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
