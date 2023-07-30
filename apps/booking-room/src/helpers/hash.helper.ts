import * as bcrypt from 'bcrypt';

export const hashBcrypt = (args: { strNeedHash: string; salt: number }) => {
  return bcrypt.hashSync(args.strNeedHash, args.salt);
};

export const compareBcrypt = (args: {
  strNeedCompare: string;
  hash: string;
}) => {
  return bcrypt.compareSync(args.strNeedCompare, args.hash);
};
