## Website article scrapper

Download content from any website that contains an `article` tag and transforms into Markdown

### How to run it

Make sure you have [Volta](https://volta.sh/) installed. Then Node and PNPM will be all properly configured for you.

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
