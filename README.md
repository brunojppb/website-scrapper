## Website article scrapper

Download content from any website that contains an `article` tag and transforms into Markdown

### How to run it

Make sure you have [Volta](https://volta.sh/) installed. Then Node and PNPM will be all properly configured for you.

Install dependencies with:

```shell
pnpm install
```

Now run the CLI with:

```shell
pnpm start -- --csv path_to_file.csv
```

Your CSV file should just contain the list of URLs like so:

```
https://example.com/path1
https://example.com/path2
https://example.com/path3
```

The output markdown files will be written to the `output` directory with a timestamp.

Example: `output/2025-08-13T13-38-29` with all markdown files there.
