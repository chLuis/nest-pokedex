import { PartialType } from '@nestjs/mapped-types';
import { CreatePokemonDto } from './create-pokemon.dto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class UpdatePokemonDto extends PartialType(CreatePokemonDto) {}
