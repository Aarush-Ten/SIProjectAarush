"""Versioned, developer-authored quiz bank. Never import into the frontend."""

# prompt, four options, correct option, explanation. Stable IDs use slug + ordinal.
QUIZZES = {
    "networking-basics": ("Networking basics", "networking", [
        ("What does DNS primarily do?", ["Translate domain names to IP addresses", "Encrypt every message", "Charge a battery", "Store passwords"], "a", "DNS resolves domain names to IP addresses so clients can locate services."),
        ("Which device forwards packets between IP networks?", ["Monitor", "Router", "Keyboard", "Printer"], "b", "A router forwards packets between networks using routing information."),
        ("What does HTTPS add to HTTP?", ["Guaranteed truthful content", "Unlimited bandwidth", "Transport encryption and server authentication", "A backup copy"], "c", "TLS protects data in transit and authenticates the server certificate; it does not guarantee truthful content."),
        ("What is the usual purpose of DHCP?", ["Draw web pages", "Erase logs", "Block all traffic", "Assign network configuration automatically"], "d", "DHCP can lease IP addresses and supply network settings such as a default gateway."),
        ("What can a successful ping usually indicate?", ["Basic reachability with ICMP", "Every application is working", "A device is malware-free", "A password is correct"], "a", "An ICMP reply indicates basic reachability; application health and security need other checks."),
    ]),
    "web-basics": ("Web basics", "html", [
        ("What is HTML mainly used for?", ["Encrypting disks", "Structuring web content", "Routing packets", "Compressing video"], "b", "HTML gives web content its structure and semantic meaning."),
        ("Which HTML element is appropriate for an action on the current page?", ["div without a role", "span without handlers", "button", "An image alone"], "c", "A button provides native keyboard and activation behavior for actions."),
        ("What does CSS mainly control?", ["Database permissions", "DNS records", "Server passwords", "Presentation and layout"], "d", "CSS controls appearance and layout while HTML supplies structure."),
        ("Why associate a label with a form input?", ["To provide an accessible name and improve usability", "To hide the input from everyone", "To encrypt the value", "To bypass validation"], "a", "An associated label helps people identify and activate the input, including with assistive technology."),
        ("Where must an application validate untrusted submitted data?", ["Only in the browser", "On the server as well", "Only in a screenshot", "Nowhere"], "b", "Browser validation helps usability; server validation remains necessary because clients can be bypassed."),
    ]),
    "spreadsheet-data-basics": ("Spreadsheet and data basics", "spreadsheets", [
        ("Which formula adds values in cells A1 through A5?", ["=COUNT(A1:A5)", "=MAX(A1:A5)", "=SUM(A1:A5)", "=TEXT(A1:A5)"], "c", "SUM adds numeric values in the specified cell range."),
        ("What does filtering a table normally do?", ["Permanently deletes every unmatched row", "Changes all original values", "Encrypts the workbook", "Shows rows matching selected conditions"], "d", "Filtering changes the visible rows without normally deleting the underlying records."),
        ("What is a useful first step before analyzing a new dataset?", ["Check missing values, types and duplicates", "Assume every row is correct", "Delete the source immediately", "Publish personal identifiers"], "a", "Basic data quality checks identify problems that could distort analysis."),
        ("What does $A$1 represent in many spreadsheet formulas?", ["An invalid address", "An absolute cell reference", "A web address", "A hidden row"], "b", "Dollar signs anchor the column and row when copying a formula."),
        ("Which chart is commonly suitable for a value over time?", ["An unrelated picture", "A password field", "A line chart", "A file icon"], "c", "A line chart can show changes over ordered time points; the choice still depends on the data."),
    ]),
}
