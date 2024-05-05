import UserModelHelper from "./UserModelHelper";

const includeRowDetails = {
  ...UserModelHelper.includeSimpleCreatedByUser,
  createdByApiKey: true,
  tenant: true,
  values: { include: { media: true, multiple: true, range: true } },
  workflowState: true,
  tags: { include: { tag: true } },
  parentRows: {
    include: {
      parent: {
        include: {
          createdByUser: { select: UserModelHelper.selectSimpleUserProperties },
          createdByApiKey: true,
          values: { include: { media: true, multiple: true, range: true } },
        },
      },
    },
  },
  childRows: {
    include: {
      child: {
        include: {
          createdByUser: { select: UserModelHelper.selectSimpleUserProperties },
          createdByApiKey: true,
          values: { include: { media: true, multiple: true, range: true } },
          childRows: {
            include: {
              child: {
                include: {
                  values: { include: { media: true, multiple: true, range: true } },
                },
              },
            },
          },
        },
      },
    },
  },
  permissions: true,
  sampleCustomEntity: true,
};

export default {
  includeRowDetails,
};
