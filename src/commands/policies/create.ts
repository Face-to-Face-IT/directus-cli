import {createPolicy} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Create an access policy (Directus 11+).
 */
export default class PoliciesCreate extends BaseCommand<typeof PoliciesCreate> {
  static override args = {};
  static override description = 'Create an access policy in the Directus instance (Directus 11+)';
  static override examples = ['<%= config.bin %> <%= command.id %> --name "Can Edit Cases" --role <role-id>'];
  static override flags = {
    ...BaseCommand.baseFlags,
    icon: Flags.string({
      default: 'policy',
      description: 'Policy icon',
    }),
    name: Flags.string({
      char: 'n',
      description: 'Policy name',
      required: true,
    }),
    role: Flags.string({
      char: 'r',
      description: 'Role ID to attach policy to',
      helpValue: '<role-id>',
    }),
    user: Flags.string({
      char: 'u',
      description: 'User ID to attach policy to (for user-specific policies)',
      helpValue: '<user-id>',
    }),
  };
  static override summary = 'Create policy';

  public async run(): Promise<void> {
    const {flags} = await this.parse(PoliciesCreate);

    const policyData: Record<string, unknown> = {
      icon: flags.icon,
      name: flags.name,
    };

    if (flags.role) policyData.role = flags.role;
    if (flags.user) policyData.user = flags.user;

    const sdkCommand = createPolicy(policyData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
