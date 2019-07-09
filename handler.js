module.exports.hello = async event => {
  const name =
    (event.queryStringParameters && event.queryStringParameters.name) ||
    "Nobody";
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello ${name}`
    })
  };
};
