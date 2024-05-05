import { Client } from "@notionhq/client";

async function getDatabases({ token }: { token: string }) {
  const notion = new Client({
    auth: token,
  });
  const response = await notion.search({});
  // eslint-disable-next-line no-console
  console.log({ token, response });

  return response.results;
}

// async function getDatabase(id: string, { token }: { token: string }) {
//   const notion = new Client({
//     auth: process.env.NOTION_API_KEY,
//   });
//   const response = await notion.search({});

//   return response.results;
// }

export default {
  getDatabases,
};
