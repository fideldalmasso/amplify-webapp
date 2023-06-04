/* Amplify Params - DO NOT EDIT
	API_AMPLIFYDATASOURCE_COMMENTTABLE_ARN
	API_AMPLIFYDATASOURCE_COMMENTTABLE_NAME
	API_AMPLIFYDATASOURCE_GRAPHQLAPIENDPOINTOUTPUT
	API_AMPLIFYDATASOURCE_GRAPHQLAPIIDOUTPUT
	API_AMPLIFYDATASOURCE_POSTTABLE_ARN
	API_AMPLIFYDATASOURCE_POSTTABLE_NAME
	AUTH_AMPLIFYDATASTORE4430C54A_USERPOOLID
	ENV
	REGION
	STORAGE_S39C9D864B_BUCKETNAME
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    return {
        statusCode: 200,
    //  Uncomment below to enable CORS requests
    //  headers: {
    //      "Access-Control-Allow-Origin": "*",
    //      "Access-Control-Allow-Headers": "*"
    //  },
        body: JSON.stringify('Hello from Lambda!'),
    };
};
