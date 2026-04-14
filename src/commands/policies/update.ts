import {updatePolicy} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Update an access policy.
 */
export default class PoliciesUpdate extends BaseCommand<typeof PoliciesUpdate> {
  static override args = {
    id: Args.string({
      description: 'Policy ID',
      required: true,
    }),
  };
  static override description = 'Update an access policy (Directus 11+)';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <policy-id> --name "New Name"',
    '<%= config.bin %> <%= command.id %> <policy-id> --role <new-role-id>',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    icon: Flags.string({
      description: 'Policy icon',
    }),
    name: Flags.string({
      char: 'n',
      description: 'Policy name',
    }),
    role: Flags.string({
      char: 'r',
      description: 'Role ID to attach policy to',
      helpValue: '<role-id>',
    }),
    user: Flags.string({
      char: 'u',
      description: 'User ID to attach policy to',
      helpValue: '<user-id>',
    }),
  };
  static override summary = 'Update policy';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PoliciesUpdate);

    const policyData: Record<string, unknown> = {};

    if (flags.name) policyData.name = flags.name;
    if (flags.icon) policyData.icon = flags.icon;
    if (flags.role) policyData.role = flags.role;
    if (flags.user) policyData.user = flags.user;

    if (Object.keys(policyData).length === 0) {
      this.error('At least one field to update must be provided');
    }

    const sdkCommand = updatePolicy(args.id, policyData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
