export interface Skill {
  name: string;
  description: string;
  execute(input: any): Promise<any>;
}
