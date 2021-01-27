const axios = require('axios');
const dotenv = require('dotenv');
const {execSync} = require('child_process');

dotenv.config();

const ticketId =
  process.env['TICKET_ID'] === undefined
    ? execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
    : process.env['TICKET_ID'];
const url = `${process.env['JIRA_API_BASE_URL']}issue/${ticketId}`;
const auth = {
  username: process.env['JIRA_USERNAME'],
  password: process.env['JIRA_API_KEY']
};

(async () => {
  console.log(`Checked ticket ${ticketId}`);

  try {
    const {data} = await axios.get(url, {auth});

    if (data.fields.issuelinks) {
      // Check if has an associated ticket on "is blocked by" and is not "Done"
      const isBlockedAndNoDone = data.fields.issuelinks.filter((issue) => {
        return (
          issue.type.inward === 'is blocked by' &&
          'inwardIssue' in issue &&
          !['10000', '10623'].includes(issue.inwardIssue.fields.status.id)
        );
      });

      if (isBlockedAndNoDone.length === 0) {
        // If there's no ticket -> send OK
        console.log(`${ticketId} is not blocked ✅`);
        process.exitCode = 0;
      } else {
        // If there're tickets -> send NOK and ID tickets
        console.error(`${ticketId} is blocked by ticket:`);
        isBlockedAndNoDone.forEach((issue) => {
          if (
            issue.type.inward === 'is blocked by' &&
            'inwardIssue' in issue &&
            issue.inwardIssue.fields.status.statusCategory.id !== 3
          ) {
            console.error(`- ${issue.inwardIssue.key}`);
          }
        });
        process.exitCode = 1;
      }
    }
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
})();
