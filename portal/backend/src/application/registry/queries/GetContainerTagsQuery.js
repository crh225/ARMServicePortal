/**
 * Query to get tags for a specific container repository
 */
export class GetContainerTagsQuery {
  constructor({ repositoryName }) {
    if (!repositoryName) {
      throw new Error("Repository name is required");
    }
    this.repositoryName = repositoryName;
    this.type = "GetContainerTagsQuery";
  }
}
