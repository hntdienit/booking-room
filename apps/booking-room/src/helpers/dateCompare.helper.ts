import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'greaterThan', async: false })
export class GreaterThan implements ValidatorConstraintInterface {
  validate(propertyValue: string, args: ValidationArguments) {
    return propertyValue > args.object[args.constraints[0]];
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be greater than ${args.constraints[0]}`;
  }
}

@ValidatorConstraint({ name: 'greaterThanOrEqual', async: false })
export class GreaterThanOrEqual implements ValidatorConstraintInterface {
  validate(propertyValue: string, args: ValidationArguments) {
    return propertyValue >= args.object[args.constraints[0]];
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be greater than or equal ${args.constraints[0]}`;
  }
}
