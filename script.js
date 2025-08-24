import { Client, Databases, Query } from "node-appwrite";

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("67d5e484001dab3f9eec")
  .setKey(
    "standard_00e14d22a6237eaf39d3f47c7d2fd9e97f8537cc6f8f61904a3b39c7e16df3192f972a48da1783eb4bfe9f1e0eefe3ff427e894fd5688b9c762cbe7e4e733ff51ead128fd0bd6e06508e5158e11bd47a5bb2d69ab37cf7d4cb08920d23809e9f3904f6fc3a1ab003b85dbc1cd19b9b18c451e7ea46139c6599028955a9745360"
  );

const databases = new Databases(client);

async function updateUsersClerkId() {
  const DATABASE_ID = "67d5e4cb00376e4b89e3";
  const COLLECTION_ID = "users";
  const LIMIT = 100; // Max limit per request
  let offset = 0;
  let totalProcessed = 0;

  try {
    while (true) {
      // Fetch a batch of documents
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.isNull("clerkId"), Query.limit(LIMIT), Query.offset(offset)]
      );

      const documents = response.documents;
      console.log(
        `Fetched ${documents.length} users with null clerkId at offset ${offset}`
      );

      if (documents.length === 0) {
        console.log("No more documents to process.");
        break;
      }

      // Update each document in the batch
      for (const doc of documents) {
        const newClerkId = `telegram_${doc.telegramId || doc.$id}`;
        await databases.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
          clerkId: newClerkId,
        });
        console.log(`Updated user ${doc.$id} with clerkId: ${newClerkId}`);
        totalProcessed++;
      }

      // Move to the next batch
      offset += LIMIT;
    }

    console.log(`Total users updated: ${totalProcessed}`);
  } catch (error) {
    console.error("Error updating users:", error.message);
  }
}

updateUsersClerkId();
