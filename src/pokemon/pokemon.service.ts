import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {
  private defaultLimit: number;
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configServicer: ConfigService,
  ) {
    this.defaultLimit = +configServicer.getOrThrow('defaultLimit');
  }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(querys: PaginationDto) {
    console.log(this.defaultLimit);
    const { limit = this.defaultLimit, offset = 0 } = querys;
    const pokemons = await this.pokemonModel
      .find()
      .limit(limit)
      .skip(offset)
      //.sort({ no: 1 })
      .select('-__v');
    return pokemons;
  }

  async findOne(term: string) {
    let pokemon: Pokemon;

    if (!isNaN(+term)) {
      try {
        const foundPokemon = await this.pokemonModel.findOne({ no: term });
        if (!foundPokemon) {
          throw new BadRequestException(`Pokemon with n° "${term}" not found`);
        }
        pokemon = foundPokemon;
        return pokemon;
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        console.log(error?.response?.message);
        throw new InternalServerErrorException('Cant find pokemon - Check');
      }
    }

    if (isValidObjectId(term)) {
      const pokemonExist = await this.pokemonModel.findById(term);
      if (!pokemonExist) {
        throw new BadRequestException(`Pokemon with id "${term}" not found`);
      }
      pokemon = pokemonExist;
      return pokemon;
    }

    const pokemonExist = await this.pokemonModel.findOne({ name: term });
    if (!pokemonExist) {
      throw new BadRequestException(`Pokemon with name "${term}" not found`);
    }
    pokemon = pokemonExist;
    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);
    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const newPokemon = await pokemon.updateOne(updatePokemonDto);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return { ...pokemon.toJSON(), ...newPokemon };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    // const pokemon = await this.pokemonModel.findByIdAndDelete(id);
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });
    if (deletedCount === 0) {
      throw new BadRequestException(`Pokemon with id "${id}" not found`);
    }
    return `Pokemon with id:${id} has been deleted`;
  }

  private handleExceptions(error: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error?.code === 11000) {
      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Pokemon already exists - ${JSON.stringify(error?.keyValue)}`,
      );
    }
    console.log(error);
    throw new InternalServerErrorException('Cant create pokemon - Check');
  }
}
