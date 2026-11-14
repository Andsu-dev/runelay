import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, memberAc, ownerAc } from "better-auth/plugins/organization/access";
import { API_KEY_ACTIONS } from "@/modules/auth/constants/auth.constants";

export const accessControl = createAccessControl({ ...defaultStatements, apiKey: API_KEY_ACTIONS });

export const organizationRoles = {
  owner: accessControl.newRole({ ...ownerAc.statements, apiKey: [...API_KEY_ACTIONS] }),
  admin: accessControl.newRole({ ...adminAc.statements, apiKey: [...API_KEY_ACTIONS] }),
  member: accessControl.newRole({ ...memberAc.statements, apiKey: [...API_KEY_ACTIONS] }),
};
