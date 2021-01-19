const axios =  require('axios');
const dotenv = require('dotenv');

dotenv.config();

const ticketId = process.env['TICKET_ID'];
const url = `${process.env['API_BASE_URL']}/issue/${ticketId}`;
const auth = {
    username: process.env['JIRA_USERNAME'],
    password: process.env['JIRA_API_KEY']
};

(async () => {
    console.log(`Checked ticket ${ticketId}`);

    try {
        const {data} = await axios.get(url, {auth});

        if (data.fields.issuelinks) {
            const isBlockedAndNoDone = data.fields.issuelinks.filter((issue) => !((issue.type.inward === 'is blocked by') && ('inwardIssue' in issue) && (issue.inwardIssue.fields.status.statusCategory.id === 3)));

            if (isBlockedAndNoDone.length === 0) {
                process.exitCode = 0;
            } else {
                process.exitCode = 1;
            }
        }
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    }
})();