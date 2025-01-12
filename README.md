# Data Tumbler for Google Sheets

This is a simple randomizer that works with Google Sheets as the data source. It will randomly select and display one item from each column. This is useful if you need to quickly tumble random combinations of your own data, for instance to generate a random activity or for design constraints. To load data, use a public Google Sheet URL with 'CSV' set as the output format. The UI will load all columns and use the first row as labels.

Update `vite.config.js` with your repo name.
To change the default URL, update the `DEFAULT_SHEET_URL` value in `index.html`.

**[Example Google Doc](https://docs.google.com/spreadsheets/d/1CG_G7xA2PMgo3byQ6jyHbVz-Xr_4CYZAhsmortPA-QY/edit?gid=0#gid=0)**

![tumbler](https://github.com/user-attachments/assets/055cb89a-84f0-44f8-b1b0-57d5a294bef8)

## Advanced Usage

URL Parameters:
- ?seed=123 : Use specific seed for consistent random combinations (e.g. ?seed=42)
- ?random=true : Generate new random combination
- ?hide-controls=true : Hide all UI controls (clean view mode)
- ?sheet=URL : Use custom Google Sheets URL (must be published to web as CSV)
