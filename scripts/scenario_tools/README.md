# Jimmy Yodeler - Scenario Tools

This directory contains tools to help you create and manage training scenarios for the Jimmy Yodeler Military Voice Procedure Trainer.

## Overview

The tools provided here allow you to:

1. Define new training scenarios using CSV templates
2. Generate SQL statements to insert these scenarios into the database
3. Execute the SQL statements to add the scenarios to your database

## Files

- `scenario_template.csv` - Template for defining basic scenario information
- `script_lines_template.csv` - Template for defining the detailed script lines for each scenario
- `generate_scenario_sql.js` - Node.js script that processes the CSV files and generates SQL
- `generate_sql.sh` - Shell script to install dependencies and run the generator
- `execute_sql.sh` - Shell script to execute the generated SQL against the database
- `README.md` - This file

## How to Use

### Step 1: Fill out the CSV Templates

#### Scenario Template (`scenario_template.csv`)

This file contains the basic information about each scenario:

| Field | Description | Example |
|-------|-------------|---------|
| title | The title of the scenario | "Radio Check Example" |
| description | A brief description of the scenario | "Practice basic radio checks and acknowledgments" |
| difficulty | The difficulty level (beginner, intermediate, advanced) | "beginner" |
| category | The category of the scenario (general, reports, emergency, etc.) | "general" |
| audio_filter_type | The type of audio filter to apply (radio, static, lowpass, highpass, none) | "radio" |

#### Script Lines Template (`script_lines_template.csv`)

This file contains the detailed script lines for each scenario:

| Field | Description | Example |
|-------|-------------|---------|
| scenario_title | The title of the scenario (must match a title in scenario_template.csv) | "Radio Check Example" |
| line_number | The order of the line in the scenario | 1 |
| is_prompter | 1 if this is a prompter line, 0 if this is a user line | 1 |
| prompter_text | The text spoken by the prompter (only for prompter lines) | "Alpha-1, this is Command. Radio check, over." |
| user_text | The expected user response (only for user lines) | "Command, this is Alpha-1. I read you loud and clear, over." |
| phase_context | Background information for this phase of the scenario | "Initial radio check phase. Your team is beginning a patrol mission." |
| prompter_callsign | The callsign of the prompter (only for prompter lines) | "Command" |

### Step 2: Generate SQL

After filling out the templates, run the generator script:

```bash
# Make the script executable (if needed)
chmod +x generate_sql.sh

# Run the script
./generate_sql.sh
```

This will:
1. Install any required dependencies
2. Process the CSV files
3. Generate a SQL file named `scenario_insert.sql`

### Step 3: Execute the SQL

You can execute the generated SQL in several ways:

#### Option 1: Using the execute_sql.sh script

```bash
# Make the script executable (if needed)
chmod +x execute_sql.sh

# Run the script
./execute_sql.sh
```

This script will:
1. Prompt you for your MySQL username, password, and database name
2. Execute the SQL file against your database
3. Report whether the operation was successful

#### Option 2: Using the MySQL command line

```bash
mysql -u <username> -p <database_name> < scenario_insert.sql
```

#### Option 3: Using a database management tool

1. Open your database management tool (e.g., MySQL Workbench, phpMyAdmin)
2. Open the `scenario_insert.sql` file
3. Execute the SQL statements

## Tips for Creating Scenarios

1. **Scenario Structure**: A typical scenario consists of alternating prompter and user lines. The prompter speaks, then the user responds, and so on.

2. **Line Numbering**: Line numbers should be sequential, starting from 1. They determine the order of the lines in the scenario.

3. **Prompter vs. User Lines**: 
   - For prompter lines (is_prompter = 1), fill in the prompter_text and leave user_text empty.
   - For user lines (is_prompter = 0), fill in the user_text and leave prompter_text empty.

4. **Phase Context**: Provide meaningful context for each phase of the scenario. This helps the user understand the situation and respond appropriately.

5. **Callsigns**: The prompter_callsign field allows you to specify different callsigns for different prompters in the scenario. This is useful if the scenario involves multiple characters.

## Example

The templates include example scenarios to help you get started. You can modify these examples or create new scenarios based on them.

## Database Setup

Before using these tools, ensure your MySQL database is properly set up:

1. **Database Configuration**:
   - Database Name: jimmy_yodeler
   - Username: root
   - Password: (empty)
   - Host: localhost
   - Port: 3306

2. **Installing MySQL**:
   If MySQL is not installed, you can install it using Homebrew:
   ```bash
   brew install mysql
   brew services start mysql
   ```

3. **Creating the Database**:
   ```bash
   /opt/homebrew/Cellar/mysql/9.2.0_2/bin/mysql -u root -e "CREATE DATABASE IF NOT EXISTS jimmy_yodeler;"
   ```

4. **Setting Up the Schema**:
   ```bash
   /opt/homebrew/Cellar/mysql/9.2.0_2/bin/mysql -u root jimmy_yodeler < ../../database/schema.sql
   ```

5. **Loading Sample Data**:
   ```bash
   /opt/homebrew/Cellar/mysql/9.2.0_2/bin/mysql -u root jimmy_yodeler < ../../database/seed.sql
   ```

## Troubleshooting

If you encounter any issues:

1. **CSV Format**: Ensure your CSV files are properly formatted. Fields containing commas should be enclosed in double quotes.

2. **Dependencies**: If the script fails to install dependencies, try installing them manually:
   ```bash
   npm install csv-parse csv-stringify
   ```

3. **Permissions**: If you can't execute the script, check the permissions:
   ```bash
   chmod +x generate_sql.sh
   chmod +x execute_sql.sh
   chmod +x generate_scenario_sql.js
   ```

4. **MySQL Command Not Found**: If you get a "mysql: command not found" error, the execute_sql.sh script has been updated to use the full path to the MySQL client. If you're still having issues, you can add MySQL to your PATH:
   ```bash
   echo 'export PATH="/opt/homebrew/Cellar/mysql/9.2.0_2/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

5. **SQL Errors**: If the SQL execution fails, check the error message and verify that your database schema matches the expected schema.

6. **Accessing MySQL Directly**: To access your database directly, you can use:
   ```bash
   /opt/homebrew/Cellar/mysql/9.2.0_2/bin/mysql -u root jimmy_yodeler
   ```
